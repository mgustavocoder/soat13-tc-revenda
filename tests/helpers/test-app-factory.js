import express from 'express'
import cors from 'cors'
import { xss } from 'express-xss-sanitizer'

export function applyCommonMiddleware(app) {
  app.use(express.json())
  app.use(cors())
  app.use(xss())
  return app
}

export function wrapController(controllerMethod) {
  return async (req, res) => {
    try {
      await controllerMethod(req, res)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}
