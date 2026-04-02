import express from 'express';
import { runTraceroute } from '../utils/traceroute.js';
import { parseTraceroute } from '../utils/parser.js';
import { enrichHop } from "../utils/geo.js";

const router = express.Router();

router.get('/',async(req,res)=>{
    const {domain} = req.query;

    try {
    const raw = await runTraceroute(domain);
    const parsed = parseTraceroute(raw);

   
    const enriched = await Promise.all(
      parsed.map(hop => enrichHop(hop))
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
    

})
export default router;