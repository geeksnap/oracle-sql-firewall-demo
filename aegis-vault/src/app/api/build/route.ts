import { NextResponse } from "next/server";
import {
  APP_BUILD_NUMBER,
  EXPECTED_DB_PACKAGE_VERSION,
} from "@lib/build-info";
import {
  fetchAegisSocAllowListEnforced,
  fetchDbPackageVersion,
  isDbPackageVersionOk,
} from "@lib/db/queries";

export async function GET() {
  try {
    const [dbPackageVersion, socAllowListEnforced] = await Promise.all([
      fetchDbPackageVersion(),
      fetchAegisSocAllowListEnforced(),
    ]);

    return NextResponse.json({
      build: APP_BUILD_NUMBER,
      expectedDbPackageVersion: EXPECTED_DB_PACKAGE_VERSION,
      dbPackageVersion,
      dbPackageOk: isDbPackageVersionOk(
        dbPackageVersion,
        EXPECTED_DB_PACKAGE_VERSION,
      ),
      socAllowListEnforced,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
