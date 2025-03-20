package models

import "time"

type Event struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	Name             string    `json:"name"`
	StartDate        string    `json:"startdate"`
	EndDate          string    `json:"enddate"`
	StartTime        string    `json:"startTime"`
	EndTime          string    `json:"endTime"`
	DressCode        string    `json:"dress_code"`
	Description      string    `json:"description"`
	ImageURL         string    `json:"image_url"`
	CreatedAt        time.Time `json:"created_at"`
	OutfitSuggestion string    `json:"outfit_suggestion"`
}

type Invitation struct {
	ID        string    `json:"id"`
	EventID   string    `json:"event_id"`
	UserID    string    `json:"user_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
