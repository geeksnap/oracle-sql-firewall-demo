import type { NextConfig } from "next";
import buildInfo from "./build-info.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["oracledb"],
  env: {
    NEXT_PUBLIC_BUILD_NUMBER: String(buildInfo.build),
    NEXT_PUBLIC_DB_PACKAGE_VERSION: buildInfo.expectedDbPackageVersion,
  },
};

export default nextConfig;
