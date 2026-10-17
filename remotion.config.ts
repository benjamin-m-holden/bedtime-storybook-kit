import {Config} from "@remotion/cli/config";

// Concurrency 2 suits a small VM; raise it on a desktop.
Config.setConcurrency(2);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
