package api

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func init() {
	// `.env` laden
	godotenv.Load()
}

// SaveImage speichert ein AI-generiertes Bild in Supabase Storage
func SaveImage(c *fiber.Ctx) error {
	imageUrl := c.Query("imageUrl")
	dressCode := c.Query("dressCode")

	if imageUrl == "" || dressCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing imageUrl or dressCode"})
	}

	// Lade das Bild von OpenAI
	resp, err := http.Get(imageUrl)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return c.Status(resp.StatusCode).JSON(fiber.Map{"error": "Failed to fetch AI image"})
	}

	// Lese die Bilddaten in einen Buffer
	var buf bytes.Buffer
	_, err = io.Copy(&buf, resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to read image data"})
	}

	// Dateinamen generieren
	timestamp := time.Now().Unix()
	fileName := fmt.Sprintf("%d-%s.png", timestamp, dressCode)

	// Supabase HTTP Upload-URL
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseBucket := "event-images"
	uploadUrl := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, fileName)

	// HTTP-Request zum Hochladen der Datei an Supabase senden
	req, err := http.NewRequest("POST", uploadUrl, &buf)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create upload request"})
	}

	// Setze die notwendigen Headers für Supabase Upload
	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_ANON_KEY"))
	req.Header.Set("Content-Type", "image/png")

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Supabase upload failed"})
	}
	defer resp.Body.Close()

	// Öffentliche URL generieren
	publicUrl := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, fileName)

	return c.JSON(fiber.Map{"imageUrl": publicUrl})
}
