package site

import (
	"embed"
	"io/fs"
	"net"
	"net/http"
)

//go:embed all:web
var webFS embed.FS

const Product = "appcompiler.ai"

func Handler() http.Handler {
	sub, err := fs.Sub(webFS, "web")
	if err != nil {
		mux := http.NewServeMux()
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "site assets missing", http.StatusInternalServerError)
		})
		return mux
	}
	return http.FileServer(http.FS(sub))
}

func Listen(addr string) (net.Listener, string, error) {
	if addr == "" {
		addr = "127.0.0.1:0"
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return nil, "", err
	}
	port := ln.Addr().(*net.TCPAddr).Port
	url := "http://127.0.0.1:" + itoa(port) + "/?client=windows&desktop=1"
	return ln, url, nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var b [16]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}
