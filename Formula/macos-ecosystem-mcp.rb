class MacosEcosystemMcp < Formula
  desc "MCP server for macOS Reminders, Calendar, and Notes via native EventKit"
  homepage "https://github.com/neverprepared/macos-ecosystem-mcp"
  version "0.3.2"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "b9a865f7ba125ebdabe8ebe8d9e45a4857bde0c3d1cb201db4dfa9c99f543654"
    end

    on_intel do
      # Intel Mac: binary runs via Rosetta 2
      url "https://github.com/neverprepared/macos-ecosystem-mcp/releases/download/v#{version}/macos-mcp-arm64"
      sha256 "b9a865f7ba125ebdabe8ebe8d9e45a4857bde0c3d1cb201db4dfa9c99f543654"
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
