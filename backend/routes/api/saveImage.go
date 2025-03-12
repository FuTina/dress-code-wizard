package api

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func init() {
	godotenv.Load()
}

// SaveImage speichert ein AI-generiertes Bild in Supabase Storage
func SaveImage(c *fiber.Ctx) error {
	imageUrl := c.Query("imageUrl")
	dressCode := c.Query("dressCode")

	if imageUrl == "" || dressCode == "" {
		log.Println("❌ Fehlende Parameter: imageUrl oder dressCode")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing imageUrl or dressCode"})
	}

	log.Println("📥 Bild wird von OpenAI geladen:", imageUrl)

	resp, err := http.Get(imageUrl)
	if err != nil {
		log.Println("❌ Fehler beim Abrufen des Bildes:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Println("❌ Fehlerhafte Response von OpenAI:", resp.Status)
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}

	var buf bytes.Buffer
	_, err = io.Copy(&buf, resp.Body)
	if err != nil {
		log.Println("❌ Fehler beim Lesen des Bildes:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read image data"})
	}

	timestamp := time.Now().Unix()
	fileName := fmt.Sprintf("%d-%s.png", timestamp, dressCode)

	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseBucket := "event-images"
	uploadUrl := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, fileName)

	log.Println("🚀 Hochladen zu Supabase:", uploadUrl)

	req, err := http.NewRequest("POST", uploadUrl, &buf)
	if err != nil {
		log.Println("❌ Fehler beim Erstellen des Upload-Requests:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload request"})
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_ANON_KEY"))
	req.Header.Set("Content-Type", "image/png")

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		log.Println("❌ Fehler beim Hochladen des Bildes:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase upload failed"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Println("❌ Supabase Fehler:", string(body))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase upload failed"})
	}

	publicUrl := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, fileName)
	log.Println("✅ Bild erfolgreich gespeichert:", publicUrl)

	return c.JSON(fiber.Map{"imageUrl": publicUrl})
}
