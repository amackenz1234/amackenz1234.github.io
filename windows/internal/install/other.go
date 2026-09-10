//go:build !windows

package install

import (
	"fmt"
	"os/exec"
	"runtime"
)

func Notify(title, text string) {
	fmt.Printf("%s: %s\n", title, text)
}

func OpenURL(url string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url).Start()
	default:
		return exec.Command("xdg-open", url).Start()
	}
}

func CreateShortcut(target string) error { return nil }

func RemoveShortcut() error { return nil }

func WriteUninstallKey(root, uninstall string) error { return nil }

func RemoveUninstallKey() error { return nil }
