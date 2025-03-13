package routes

import (
	"log"
	"os"

	"github.com/FuTina/dress-code-wizard/routes/api"
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes registriert alle API-Endpunkte
func SetupRoutes(app *fiber.App) {

	// 🔹 Hole Variablen aus der .env Datei
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Standard für lokale Entwicklung
	}
	log.Println("🌐 Allowed FRONTEND_URL:", frontendURL)

	// Test-Route
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Backend API is running!")
	})

	// Speichert AI-Bilder
	app.Post("/api/saveImage", api.SaveImage)

	app.Options("/api/*", func(c *fiber.Ctx) error {
		log.Println("🔹 CORS Preflight Request erhalten")
		c.Set("Access-Control-Allow-Origin", frontendURL)
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		return c.SendStatus(fiber.StatusNoContent)
	})

}
