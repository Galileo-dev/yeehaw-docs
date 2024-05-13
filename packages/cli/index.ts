#! /usr/bin/env bun
import "./src/command.ts";
import { note_table_query } from './src/db';

note_table_query.run();
// console.log("Hello via Bun!");