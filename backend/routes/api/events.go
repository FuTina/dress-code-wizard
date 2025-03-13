package api

import (
	"log"

	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/models"
	"github.com/gofiber/fiber/v2"
)

// 📌 Event erstellen
func CreateEvent(c *fiber.Ctx) error {
	event := new(models.Event)
	if err := c.BodyParser(event); err != nil {
		log.Println("❌ Fehler beim Parsen der Anfrage:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Event in Supabase speichern
	err := database.Supabase.DB.From("events").Insert(event).Execute(event)
	if err != nil {
		log.Println("❌ Fehler beim Erstellen des Events:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Event erfolgreich erstellt:", event)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Event created successfully", "data": event})
}

// 📌 Alle Events abrufen
func GetEvents(c *fiber.Ctx) error {
	var events []models.Event
	err := database.Supabase.DB.From("events").Select("*").Execute(&events)
	if err != nil {
		log.Println("❌ Fehler beim Abrufen der Events:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Events erfolgreich geladen")
	return c.JSON(events)
}

// 📌 Einzelnes Event abrufen
func GetEventByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var event models.Event

	err := database.Supabase.DB.From("events").Select("*").Eq("id", id).Execute(&event)
	if err != nil {
		log.Println("❌ Fehler beim Abrufen des Events:", err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Event erfolgreich gefunden:", event)
	return c.JSON(event)
}

// 📌 Event löschen
func DeleteEvent(c *fiber.Ctx) error {
	id := c.Params("id")

	err := database.Supabase.DB.From("events").Delete().Eq("id", id).Execute(nil)
	if err != nil {
		log.Println("❌ Fehler beim Löschen des Events:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Event erfolgreich gelöscht:", id)
	return c.SendStatus(fiber.StatusNoContent)
}
