package install

import (
	"fmt"
	"os"
	"path/filepath"
)

const (
	Product     = "appcompiler.ai"
	AppExeName  = "appcompiler-ai.exe"
	SetupName   = "appcompiler-ai-setup.exe"
	Uninstall   = "uninstall.exe"
	ShortcutRel = "Microsoft/Windows/Start Menu/Programs/appcompiler.ai.lnk"
)

func DefaultRoot() string {
	if local := os.Getenv("LOCALAPPDATA"); local != "" {
		return filepath.Join(local, "Programs", Product)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", Product)
	}
	return filepath.Join(home, ".local", "share", Product)
}

func AppPath(root string) string {
	return filepath.Join(root, AppExeName)
}

func ShortcutPath() string {
	if appdata := os.Getenv("APPDATA"); appdata != "" {
		return filepath.Join(appdata, ShortcutRel)
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ShortcutRel)
}

func WriteApp(root string, exe []byte) (string, error) {
	if len(exe) < 64 || exe[0] != 'M' || exe[1] != 'Z' {
		return "", fmt.Errorf("embedded app is not a Windows .exe")
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		return "", err
	}
	dest := AppPath(root)
	if err := os.WriteFile(dest, exe, 0755); err != nil {
		return "", err
	}
	return dest, nil
}

func WriteUninstaller(root string, setup []byte) error {
	if len(setup) == 0 {
		return nil
	}
	return os.WriteFile(filepath.Join(root, Uninstall), setup, 0755)
}

func RemoveInstall(root string) error {
	return os.RemoveAll(root)
}

func Silent(args []string) bool {
	for _, a := range args {
		if a == "/S" || a == "/s" || a == "-s" || a == "--silent" {
			return true
		}
	}
	return false
}

func WantsUninstall(args []string) bool {
	for _, a := range args {
		if a == "/uninstall" || a == "--uninstall" || a == "/u" {
			return true
		}
	}
	return false
}
