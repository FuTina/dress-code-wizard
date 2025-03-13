package api

import (
	"log"

	"github.com/FuTina/dress-code-wizard/database"
	"github.com/FuTina/dress-code-wizard/models"
	"github.com/gofiber/fiber/v2"
)

// 📌 Einladung erstellen
func CreateInvitation(c *fiber.Ctx) error {
	invitation := new(models.Invitation)
	if err := c.BodyParser(invitation); err != nil {
		log.Println("❌ Fehler beim Parsen der Anfrage:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Einladung in Supabase speichern
	err := database.Supabase.DB.From("invitations").Insert(invitation).Execute(invitation)
	if err != nil {
		log.Println("❌ Fehler beim Erstellen der Einladung:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Einladung erfolgreich erstellt:", invitation)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Invitation created successfully", "data": invitation})
}

// 📌 Alle Einladungen abrufen
func GetInvitations(c *fiber.Ctx) error {
	var invitations []models.Invitation
	err := database.Supabase.DB.From("invitations").Select("*").Execute(&invitations)
	if err != nil {
		log.Println("❌ Fehler beim Abrufen der Einladungen:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Einladungen erfolgreich geladen")
	return c.JSON(invitations)
}

// 📌 Einladung annehmen
func AcceptInvitation(c *fiber.Ctx) error {
	id := c.Params("id")
	updateData := map[string]interface{}{
		"status": "accepted",
	}

	var result interface{}
	err := database.Supabase.DB.From("invitations").Update(updateData).Eq("id", id).Execute(&result)
	if err != nil {
		log.Println("❌ Fehler beim Akzeptieren der Einladung:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Println("✅ Einladung erfolgreich akzeptiert:", id)
	return c.JSON(fiber.Map{"message": "Invitation accepted"})
}
