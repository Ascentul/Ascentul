import { Router, Request, Response } from "express"
import { requireAuth } from "../auth"
import { jobProviders } from "../services/job-sources"
import { IStorage } from "../storage"

export function registerJobRoutes(app: Router, storage: IStorage) {

}
