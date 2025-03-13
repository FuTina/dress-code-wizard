package main

import (
	"fmt"
	"log"
	"os"

	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// 🔹 Lade .env-Datei, falls lokal gestartet
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file found, using default values")
	}

	// 🔹 Hole Variablen aus der .env Datei
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Standard für lokale Entwicklung
	}
	log.Println("🌐 Allowed FRONTEND_URL:", frontendURL)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Standardport setzen
	}

	// 🔹 Initialisiere Fiber
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     frontendURL,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// 🔹 Extra Middleware für Preflight OPTIONS-Requests
	app.Options("/*", func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", frontendURL)
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		return c.SendStatus(fiber.StatusNoContent)
	})

	// 📌 Datenbankverbindung herstellen
	log.Println("🔗 Connecting to database...")
	database.ConnectDB()
	log.Println("✅ Database connection established.")

	// 📌 API-Routen registrieren
	routes.SetupRoutes(app)
	log.Println("✅ API routes initialized.")

	// 📌 Server starten
	fmt.Printf("🚀 Server running on port %s\n", port)
	log.Fatal(app.Listen(":" + port))
}
