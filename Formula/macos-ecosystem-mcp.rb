class MacosEcosystemMcp < Formula
  desc "MCP server for macOS Reminders, Calendar, and Notes via AppleScript"
  homepage "https://github.com/neverprepared/macos-ecosystem-mcp"
  version "0.1.2"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "e7741710299e1d5ab740b83f7c80a7671ed7d2c0f3a2011e23c5290a4ae4965c"
    end

    on_intel do
      # Intel Mac: binary runs via Rosetta 2
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "e7741710299e1d5ab740b83f7c80a7671ed7d2c0f3a2011e23c5290a4ae4965c"
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
