class MacosEcosystemMcp < Formula
  desc "MCP server for macOS Reminders, Calendar, and Notes via native EventKit"
  homepage "https://github.com/neverprepared/macos-ecosystem-mcp"
  version "0.6.1"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "02198c32b4a78eae7ace3604482e85424f304d4d0c9bb6fa077af3743e2d680d"
    end

    on_intel do
      # Intel Mac: binary runs via Rosetta 2
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "02198c32b4a78eae7ace3604482e85424f304d4d0c9bb6fa077af3743e2d680d"
    end
  end

  def install
    bin.install "macos-mcp-arm64" => "macos-mcp"
  end

  def caveats
    <<~EOS
      Grant macOS automation permissions on first use:
        System Settings > Privacy & Security > Automation
        Enable access to: Reminders, Calendar, Notes

      Add to Claude Code (~/.claude/mcp.json):
        {
          "mcpServers": {
            "macos-ecosystem": {
              "command": "#{HOMEBREW_PREFIX}/bin/macos-mcp"
            }
          }
        }
    EOS
  end

  test do
    assert_predicate bin/"macos-mcp", :executable?
  end
end
