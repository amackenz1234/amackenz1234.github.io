package site

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandlerServesApp(t *testing.T) {
	ts := httptest.NewServer(Handler())
	t.Cleanup(ts.Close)

	res, err := http.Get(ts.URL + "/")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	html := string(body)
	if res.StatusCode != 200 {
		t.Fatalf("status %d", res.StatusCode)
	}
	if !strings.Contains(html, "appcompiler.ai") {
		t.Fatalf("index missing brand")
	}
	if !strings.Contains(html, "app.js") {
		t.Fatal("index missing app.js")
	}

	js, err := http.Get(ts.URL + "/app.js")
	if err != nil {
		t.Fatal(err)
	}
	defer js.Body.Close()
	if js.StatusCode != 200 {
		t.Fatalf("app.js status %d", js.StatusCode)
	}
}

func TestListenURLUsesWindowsClient(t *testing.T) {
	ln, url, err := Listen("127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ln.Close()
	if !strings.Contains(url, "client=windows") {
		t.Fatalf("url %s", url)
	}
	if !strings.Contains(url, "desktop=1") {
		t.Fatalf("url %s", url)
	}
}
