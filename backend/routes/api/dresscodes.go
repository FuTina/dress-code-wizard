package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/supabase-community/postgrest-go"
)

func init() {
	godotenv.Load()
}
func GetSavedDressCodes(c *fiber.Ctx) error {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")

	if supabaseUrl == "" || supabaseAnonKey == "" {
		log.Println("❌ Missing Supabase environment variables")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase configuration is missing"})
	}

	eventType := c.Query("eventType", "")

	log.Println("🔍 Fetching dress codes for eventType:", eventType)

	// Construct API URL with correct filtering
	apiUrl := fmt.Sprintf("%s/rest/v1/dress_codes?select=name,event_type", supabaseUrl)
	if eventType != "" {
		apiUrl += fmt.Sprintf("&event_type=eq.%s", eventType) // <- Korrekte Filterung in Supabase
	}

	log.Println("📡 Supabase API request:", apiUrl)

	// Create request to Supabase
	req, err := http.NewRequest("GET", apiUrl, nil)
	if err != nil {
		log.Println("❌ Error creating request:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create API request"})
	}

	// Add necessary headers
	req.Header.Set("Authorization", "Bearer "+supabaseAnonKey)
	req.Header.Set("apikey", supabaseAnonKey)
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("❌ Error fetching dress codes:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch dress codes"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("❌ Supabase API error: %s\n", resp.Status)
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Supabase API error"})
	}

	// Parse response
	var results []map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		log.Println("❌ Error decoding response:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode response"})
	}

	// Return all dress codes (filtered)
	if len(results) == 0 {
		log.Println("⚠️ No dress codes found for eventType:", eventType)
	}

	log.Println("✅ Retrieved dress codes:", results)
	return c.JSON(results)
}

// Insert a new dress code into Supabase
func InsertDressCode(c *fiber.Ctx) error {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")
	supabaseAnonKey = os.Getenv("SUPABASE_ANON_KEY")
	if supabaseUrl == "" || supabaseAnonKey == "" {
		log.Println("❌ Missing Supabase environment variables")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase configuration is missing"})
	}

	supabaseClient := postgrest.NewClient(supabaseUrl+"/rest/v1", "", map[string]string{
		"Authorization": "Bearer " + supabaseAnonKey,
		"apikey":        supabaseAnonKey,
	})

	type DressCode struct {
		Name      string `json:"name"`
		EventType string `json:"event_type"`
	}

	var dressCode DressCode
	if err := c.BodyParser(&dressCode); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	log.Println("📝 Adding DressCode:", dressCode.Name, "Type:", dressCode.EventType)

	// Removed unused response variable
	data, count, err := supabaseClient.From("dress_codes").Insert(dressCode, false, "", "", "").Execute()
	if err != nil {
		log.Println("❌ Error inserting dress code:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to insert dress code"})
	}

	if count == 0 {
		log.Println("⚠️ No dress code was inserted")
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "No dress code was inserted"})
	}

	log.Println("✅ Dress code inserted successfully:", data)

	if err != nil {
		log.Println("❌ Error inserting dress code:", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to insert dress code"})
	}

	return c.JSON(fiber.Map{"message": "Dress code added successfully"})
}
