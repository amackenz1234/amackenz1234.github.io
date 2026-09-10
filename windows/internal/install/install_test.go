package install

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDefaultRootPrefersLocalAppData(t *testing.T) {
	t.Setenv("LOCALAPPDATA", filepath.Join(t.TempDir(), "Local"))
	root := DefaultRoot()
	if filepath.Base(filepath.Dir(root)) != "Programs" {
		t.Fatalf("root %s", root)
	}
	if filepath.Base(root) != Product {
		t.Fatalf("root %s", root)
	}
}

func TestWriteAppRejectsNonPE(t *testing.T) {
	_, err := WriteApp(t.TempDir(), []byte("not an exe"))
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestWriteAppAcceptsMZ(t *testing.T) {
	buf := make([]byte, 128)
	buf[0], buf[1] = 'M', 'Z'
	root := t.TempDir()
	dest, err := WriteApp(root, buf)
	if err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(dest)
	if err != nil {
		t.Fatal(err)
	}
	if got[0] != 'M' || got[1] != 'Z' {
		t.Fatal("written file is not MZ")
	}
}

func TestSilentAndUninstallFlags(t *testing.T) {
	if !Silent([]string{"/S"}) {
		t.Fatal("silent")
	}
	if !WantsUninstall([]string{"/uninstall"}) {
		t.Fatal("uninstall")
	}
	if Silent([]string{}) || WantsUninstall([]string{}) {
		t.Fatal("empty args")
	}
}
