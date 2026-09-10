//go:build windows

package install

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"unsafe"
)

func Notify(title, text string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	proc := user32.NewProc("MessageBoxW")
	tp, err1 := syscall.UTF16PtrFromString(title)
	sp, err2 := syscall.UTF16PtrFromString(text)
	if err1 != nil || err2 != nil {
		return
	}
	proc.Call(0, uintptr(unsafe.Pointer(sp)), uintptr(unsafe.Pointer(tp)), 0)
}

func OpenURL(url string) error {
	return exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}

func CreateShortcut(target string) error {
	lnk := ShortcutPath()
	if err := os.MkdirAll(filepath.Dir(lnk), 0755); err != nil {
		return err
	}
	script := fmt.Sprintf(
		"$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%s'); $s.TargetPath = '%s'; $s.WorkingDirectory = '%s'; $s.Description = '%s'; $s.Save()",
		escapePS(lnk),
		escapePS(target),
		escapePS(filepath.Dir(target)),
		escapePS(Product),
	)
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("shortcut: %w: %s", err, out)
	}
	return nil
}

func RemoveShortcut() error {
	return os.Remove(ShortcutPath())
}

func WriteUninstallKey(root, uninstall string) error {
	cmd := exec.Command("reg", "add",
		`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\`+Product,
		"/v", "DisplayName", "/t", "REG_SZ", "/d", Product, "/f",
	)
	if err := cmd.Run(); err != nil {
		return err
	}
	args := [][]string{
		{"DisplayIcon", AppPath(root)},
		{"InstallLocation", root},
		{"UninstallString", uninstall},
		{"Publisher", Product},
	}
	for _, pair := range args {
		if err := exec.Command("reg", "add",
			`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\`+Product,
			"/v", pair[0], "/t", "REG_SZ", "/d", pair[1], "/f",
		).Run(); err != nil {
			return err
		}
	}
	return nil
}

func RemoveUninstallKey() error {
	return exec.Command("reg", "delete",
		`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\`+Product,
		"/f",
	).Run()
}

func escapePS(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		if r == '\'' {
			out = append(out, '\'', '\'')
			continue
		}
		out = append(out, r)
	}
	return string(out)
}
