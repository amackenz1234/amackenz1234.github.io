package main

import (
	_ "embed"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/amackenz1234/amackenz1234.github.io/windows/internal/install"
)

//go:embed payload/appcompiler-ai.exe
var appBinary []byte

func main() {
	args := os.Args[1:]
	root := install.DefaultRoot()
	silent := install.Silent(args)

	if install.WantsUninstall(args) {
		_ = install.RemoveShortcut()
		_ = install.RemoveUninstallKey()
		if err := install.RemoveInstall(root); err != nil && !silent {
			install.Notify(install.Product, "Could not uninstall: "+err.Error())
			os.Exit(1)
		}
		if !silent {
			install.Notify(install.Product, "appcompiler.ai was uninstalled.")
		}
		return
	}

	dest, err := install.WriteApp(root, appBinary)
	if err != nil {
		if !silent {
			install.Notify(install.Product, "Install failed: "+err.Error())
		}
		os.Exit(1)
	}

	self, _ := os.Executable()
	if self != "" {
		if data, err := os.ReadFile(self); err == nil {
			_ = install.WriteUninstaller(root, data)
		}
	}
	uninstall := filepath.Join(root, install.Uninstall)
	_ = install.CreateShortcut(dest)
	_ = install.WriteUninstallKey(root, `"`+uninstall+`" /uninstall`)

	if !silent {
		install.Notify(install.Product, "Installed to "+root+". Starting appcompiler.ai…")
		cmd := exec.Command(dest)
		cmd.Dir = root
		_ = cmd.Start()
	}
}
