package main

import (
	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/routes"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	// 📌 Verbinde mit Supabase (lädt automatisch die .env)
	database.ConnectDB()

	// 📌 API-Routen registrieren
	routes.SetupRoutes(app)

	app.Use(func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		return c.Next()
	})

	// 📌 Server starten
	app.Listen(":8080")
}
