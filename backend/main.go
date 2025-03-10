package main

import (
	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/routes"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	database.ConnectDB()
	routes.SetupRoutes(app)

	app.Listen(":8080")
}
