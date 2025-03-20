package routes

import (
	"log"
	"os"

	"github.com/FuTina/dress-code-wizard/routes/api"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	log.Println("🌐 Allowed FRONTEND_URL:", frontendURL)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Backend API is running!")
	})

	apiGroup := app.Group("/api")

	apiGroup.Post("/events", api.CreateEvent)
	apiGroup.Get("/events", api.GetEvents)
	apiGroup.Get("/events/:id", api.GetEventByID)
	apiGroup.Delete("/events/:id", api.DeleteEvent)

	// Dress Codes API
	apiGroup.Post("/dresscodes", api.InsertDressCode)
	apiGroup.Get("/dresscodes", api.GetSavedDressCodes)

	apiGroup.Post("/saveImage", api.SaveImage)
	apiGroup.Get("/getImage", api.GetSavedImage)

	apiGroup.Post("/invitations", api.CreateInvitation)
	apiGroup.Get("/invitations", api.GetInvitations)
	apiGroup.Post("/invitations/:id/accept", api.AcceptInvitation)

	// CORS Preflight Handling
	app.Options("/api/*", func(c *fiber.Ctx) error {
		log.Println("🔹 CORS Preflight Request erhalten")
		c.Set("Access-Control-Allow-Origin", frontendURL)
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		return c.SendStatus(fiber.StatusNoContent)
	})
}
