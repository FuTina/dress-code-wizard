package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func init() {
	godotenv.Load()
}

// Supabase Storage Public URL
var supabaseBucket = "event-images"

// SaveImage stores an AI-generated image in Supabase Storage
func SaveImage(c *fiber.Ctx) error {
	log.Println("🌐 CORS Test: Request from", c.Get("Origin"))

	// Get parameters from the request
	imageUrl := c.Query("imageUrl")
	dressCode := c.Query("dressCode")
	eventType := c.Query("eventType") // New: Event type as a parameter

	// Validate required parameters
	if imageUrl == "" || dressCode == "" || eventType == "" {
		log.Println("❌ Missing parameters: imageUrl, dressCode, or eventType")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing imageUrl, dressCode, or eventType"})
	}

	log.Println("📥 Fetching image from OpenAI:", imageUrl)

	// Fetch the AI-generated image
	resp, err := http.Get(imageUrl)
	if err != nil {
		log.Println("❌ Error fetching image:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}
	defer resp.Body.Close()

	// Check if the request was successful
	if resp.StatusCode != 200 {
		log.Println("❌ Error response from OpenAI:", resp.Status)
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}

	// Read the image data into a buffer
	var buf bytes.Buffer
	_, err = io.Copy(&buf, resp.Body)
	if err != nil {
		log.Println("❌ Error reading image data:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read image data"})
	}

	// Generate a unique filename
	timestamp := time.Now().Unix()
	fileName := fmt.Sprintf("%s-%s-%d.png", dressCode, eventType, timestamp)

	// Construct Supabase storage URL
	supabaseUrl := os.Getenv("SUPABASE_URL")
	uploadUrl := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, fileName)

	log.Println("🚀 Uploading image to Supabase:", uploadUrl)

	// Use PUT instead of POST for better control over the upload process
	req, err := http.NewRequest("PUT", uploadUrl, &buf)
	if err != nil {
		log.Println("❌ Error creating upload request:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload request"})
	}

	// Set authentication and content type headers
	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_ANON_KEY"))
	req.Header.Set("Content-Type", "image/png")
	req.Header.Set("Prefer", "return=representation")

	// Perform the request
	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		log.Println("❌ Error uploading image to Supabase:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase upload failed"})
	}
	defer resp.Body.Close()

	// Handle unsuccessful upload
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Println("❌ Supabase error:", string(body))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to upload image to Supabase"})
	}

	// Construct the public URL for accessing the uploaded image
	publicUrl := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, fileName)
	log.Println("✅ Image successfully saved:", publicUrl)

	// Return the URL of the saved image
	return c.JSON(fiber.Map{"imageUrl": publicUrl})
}

func GetSavedImage(c *fiber.Ctx) error {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseBucket := "event-images"
	supabaseServiceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY") // More privileged key

	dressCode := c.Query("dressCode")
	eventType := c.Query("eventType")

	if dressCode == "" || eventType == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Missing dressCode or eventType"})
	}

	log.Println("🔍 Searching for existing image:", dressCode, eventType)

	// Construct Supabase API URL to fetch image metadata
	apiUrl := fmt.Sprintf("%s/storage/v1/object/list/%s", supabaseUrl, supabaseBucket)

	req, err := http.NewRequest("GET", apiUrl, nil)
	if err != nil {
		log.Println("❌ Error creating request:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create API request"})
	}

	// Use the **Service Role Key** for full access
	req.Header.Set("Authorization", "Bearer "+supabaseServiceRoleKey)
	req.Header.Set("apikey", supabaseServiceRoleKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("❌ Error fetching image list:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch images from Supabase"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("❌ Supabase API error: %s\n", resp.Status)
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Supabase API error"})
	}

	// Decode response
	var files []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		log.Println("❌ Error decoding response:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode response"})
	}

	log.Printf("🔍 Supabase returned %d files\n", len(files))

	// Find the most recent matching image for the given dressCode and eventType
	var latestImage string
	for _, file := range files {
		if name, ok := file["name"].(string); ok {
			log.Println("📂 Found file:", name) // Log all found files for debugging
			if strings.Contains(name, fmt.Sprintf("%s-%s", dressCode, eventType)) {
				latestImage = name
				log.Println("✅ Matching file found:", latestImage)
			}
		}
	}

	if latestImage == "" {
		log.Println("❌ No matching image found in Supabase")
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Image not found"})
	}

	// Construct the public URL for the found image
	imageUrl := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, latestImage)

	log.Println("✅ Image found:", imageUrl)
	return c.JSON(fiber.Map{"imageUrl": imageUrl})
}
