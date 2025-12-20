package main

import (
	"database/sql"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/zserge/lorca"
	_ "modernc.org/sqlite"
)

//go:embed dist/*
var frontendContent embed.FS

// DB Structure for Soul-Vault
var db *sql.DB

func initDB() {
	exePath, _ := os.Executable()
	dbPath := filepath.Join(filepath.Dir(exePath), "souls.db")

	var err error
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// Create tables if not exist
	// players: stores aggregate summary
	// logs: stores every game snapshot
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS players (
		id TEXT PRIMARY KEY,
		name TEXT,
		mbti TEXT,
		summary TEXT,
		games_count INTEGER DEFAULT 0,
		last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS game_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		player_id TEXT,
		game_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		report JSON,
		score INTEGER
	);
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		log.Printf("%q: %s\n", err, sqlStmt)
		return
	}
}

// Structs for JSON handling
type HistoryResult struct {
	Exists  bool   `json:"exists"`
	Summary string `json:"summary"`
	Count   int    `json:"count"`
}

func main() {
	initDB()
	defer db.Close()

	distFS, err := fs.Sub(frontendContent, "dist")
	if err != nil {
		log.Fatal(err)
	}

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	go http.Serve(ln, http.FileServer(http.FS(distFS)))
	url := fmt.Sprintf("http://%s", ln.Addr().String())

	ui, err := lorca.New(url, "", 1360, 850, "--remote-allow-origins=*")
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// --- BINDINGS: Bridges to JS ---

	// 1. Check for History
	ui.Bind("nativeGetHistory", func(name, mbti string) string {
		var summary string
		var count int
		err := db.QueryRow("SELECT summary, games_count FROM players WHERE name = ? AND mbti = ?", name, mbti).Scan(&summary, &count)

		res := HistoryResult{Exists: err == nil, Summary: summary, Count: count}
		b, _ := json.Marshal(res)
		return string(b)
	})

	// 2. Save Game Performance & Update Summary
	ui.Bind("nativeSaveResult", func(name, mbti, currentAnalysis, reportFull string, score int) {
		// Calculate player unique ID based on Name+MBTI for simplicity in this local context
		playerID := fmt.Sprintf("%s_%s", name, mbti)

		// Update or Insert player
		_, err := db.Exec(`
			INSERT INTO players (id, name, mbti, summary, games_count, last_seen) 
			VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
			ON CONFLICT(id) DO UPDATE SET 
				summary = summary || ' | ' || ?, 
				games_count = games_count + 1,
				last_seen = CURRENT_TIMESTAMP`,
			playerID, name, mbti, currentAnalysis, currentAnalysis)
		if err != nil {
			log.Println("Error saving player summary:", err)
		}

		// Insert game log
		_, err = db.Exec("INSERT INTO game_logs (player_id, report, score) VALUES (?, ?, ?)", playerID, reportFull, score)
		if err != nil {
			log.Println("Error saving game log:", err)
		}
	})

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, syscall.SIGTERM)

	select {
	case <-sigc:
	case <-ui.Done():
	}
	log.Println("Exiting Soul-Vault...")
}
