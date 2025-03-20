package main

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

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

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	log.Println("🌐 Allowed FRONTEND_URL:", frontendURL)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     frontendURL,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Options("/*", func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", frontendURL)
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		return c.SendStatus(fiber.StatusNoContent)
	})

	log.Println("🔗 Connecting to database...")
	database.ConnectDB()
	log.Println("✅ Database connection established.")

	routes.SetupRoutes(app)
	log.Println("✅ API routes initialized.")

	fmt.Printf("🚀 Server running on port %s\n", port)
	log.Fatal(app.Listen(":" + port))

	go func() {
		time.Sleep(3 * time.Second)
		seedDressCodes()
	}()
}
func seedDressCodes() {
	// Load BACKEND_URL from environment variables, fallback to localhost
	backendURL := os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://localhost:8080"
	}

	dressCodes := []map[string]string{
		{"name": "Neon Glow", "event_type": "party"},
		{"name": "Great Gatsby", "event_type": "party"},
		{"name": "Elegant Formal", "event_type": "business"},
		{"name": "Corporate Chic", "event_type": "business"},
		{"name": "Romantic Red", "event_type": "date"},
		{"name": "Moonlight Dinner", "event_type": "date"},
	}

	for _, dressCode := range dressCodes {
		apiURL := fmt.Sprintf("%s/api/dresscodes", backendURL)
		reqBody := bytes.NewBuffer([]byte(fmt.Sprintf(`{"name": "%s", "event_type": "%s"}`, dressCode["name"], dressCode["event_type"])))

		resp, err := http.Post(apiURL, "application/json", reqBody)
		if err != nil {
			log.Println("⚠️ Failed to insert dress code:", dressCode["name"], "Error:", err)
		} else {
			log.Println("✅ Dress Code inserted:", dressCode["name"], "Response Status:", resp.Status)
			resp.Body.Close()
		}
	}
}
