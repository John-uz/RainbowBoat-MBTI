package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/zserge/lorca"
)

//go:embed dist/*
var frontendContent embed.FS

func main() {
	// Get the dist subdirectory from the embedded files
	distFS, err := fs.Sub(frontendContent, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create a listener on a random port
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	// Start a web server to serve the frontend
	go http.Serve(ln, http.FileServer(http.FS(distFS)))

	// Calculate the URL
	url := fmt.Sprintf("http://%s", ln.Addr().String())

	// Create lorca UI
	// Set window size, title, and other parameters
	ui, err := lorca.New(url, "", 1280, 800, "--remote-allow-origins=*")
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// Wait until the window is closed or an interrupt signal is received
	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, syscall.SIGTERM)

	select {
	case <-sigc:
	case <-ui.Done():
	}

	log.Println("Exiting...")
}
