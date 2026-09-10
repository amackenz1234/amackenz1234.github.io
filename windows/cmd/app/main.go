package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/amackenz1234/amackenz1234.github.io/windows/internal/install"
	"github.com/amackenz1234/amackenz1234.github.io/windows/internal/site"
)

func main() {
	ln, url, err := site.Listen("127.0.0.1:0")
	if err != nil {
		fail(err)
	}
	go func() {
		if err := http.Serve(ln, site.Handler()); err != nil {
			log.Print(err)
		}
	}()
	if err := install.OpenURL(url); err != nil {
		log.Print(err)
	}
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt, syscall.SIGTERM)
	<-ch
}

func fail(err error) {
	install.Notify(site.Product, err.Error())
	os.Exit(1)
}
