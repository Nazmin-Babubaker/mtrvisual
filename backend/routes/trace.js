import express from 'express';
import { runTraceroute } from '../utils/traceroute.js';
import { parseTraceroute } from '../utils/parser.js';
import { enrichHop } from "../utils/geo.js";

const router = express.Router();

router.get('/',async(req,res)=>{
    const {domain} = req.query;

    try {
    const output = await runTraceroute(domain);
    const parsed =  parseTraceroute(output);

    const enriched = [];

    for (let hop of parsed) {
      const data = await enrichHop(hop);
      enriched.push(data);
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
    

})
export default router;