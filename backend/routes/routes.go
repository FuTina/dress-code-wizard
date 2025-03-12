package routes

import (
	"github.com/FuTina/dress-code-wizard/routes/api"
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes registriert alle API-Endpunkte
// func SetupRoutes(app *fiber.App) {
// 	app.Post("/api/saveImage", api.SaveImage)
// }

func SetupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Backend API is running!")
	})
	app.Post("/api/saveImage", api.SaveImage)
}
