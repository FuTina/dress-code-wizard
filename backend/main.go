package main

import (
	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()

	// 📌 CORS aktivieren (Erlaubt Requests vom Frontend)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowMethods:     "GET, POST, OPTIONS",
		AllowHeaders:     "Content-Type, Authorization",
		AllowCredentials: true,
	}))

	// 📌 Verbinde mit Supabase
	database.ConnectDB()

	// 📌 API-Routen registrieren
	routes.SetupRoutes(app)

	// 📌 Server starten
	app.Listen(":8080")
}
