class MacosEcosystemMcp < Formula
  desc "MCP server for macOS Reminders, Calendar, and Notes via native EventKit"
  homepage "https://github.com/neverprepared/macos-ecosystem-mcp"
  version "0.5.2"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "036dafffef9b4d5c6811ef67a402877973602c9556b74dc9fcbbd38b1598d4e9"
    end

    on_intel do
      # Intel Mac: binary runs via Rosetta 2
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "036dafffef9b4d5c6811ef67a402877973602c9556b74dc9fcbbd38b1598d4e9"
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
