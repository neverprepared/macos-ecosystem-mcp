// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "macos-mcp",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "macos-mcp",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk")
            ],
            path: "Sources/macos-mcp"
        )
    ],
    dependencies: [
        .package(
            url: "https://github.com/modelcontextprotocol/swift-sdk.git",
            from: "0.9.0"
        )
    ]
)
