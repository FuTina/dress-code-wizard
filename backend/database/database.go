package database

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/nedpals/supabase-go"
)

// Supabase Client
var Supabase *supabase.Client

func ConnectDB() {
	// 📌 `.env` Datei laden
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Warning: No .env file found, using system env variables")
	}

	// 📌 Supabase Verbindungsdaten aus ENV laden
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")

	if supabaseURL == "" || supabaseAnonKey == "" {
		log.Fatal("❌ ERROR: Supabase credentials are missing in .env")
	}

	// 📌 Supabase Client initialisieren (RICHTIG!)
	Supabase = supabase.CreateClient(supabaseURL, supabaseAnonKey)

	log.Println("✅ Connected to Supabase!")
}
