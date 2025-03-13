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
	// 🔹 Lade .env-Datei
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file found, using default values")
	}

	// 🔹 Hole Variablen aus der .env Datei
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Fallback für lokale Entwicklung
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 🔹 Initialisiere Fiber
	app := fiber.New()

	// 🔹 CORS Middleware mit dynamischer URL
	app.Use(cors.New(cors.Config{
		AllowOrigins: frontendURL,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// 📌 Verbinde mit Supabase
	database.ConnectDB()

	// 📌 API-Routen registrieren
	routes.SetupRoutes(app)

	// 📌 Server starten
	fmt.Println("🚀 Server running on port", port)
	log.Fatal(app.Listen(":" + port))
}
