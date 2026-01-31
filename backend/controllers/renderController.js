/**
 * Ensure a render job is enqueued for the order (no-op if no queue is configured).
 * Frontend calls this when opening order detail so server can pre-generate variant images.
 */
export const ensureRender = async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID required' });
  }
  // TODO: enqueue order for render when queue/worker is added
  return res.status(200).json({ message: 'OK' });
};

/**
 * Get render status for an order (done/total and per-variant image URLs).
 * Returns placeholder until OrderRenderStatus/queue is implemented.
 */
export const getRenderStatus = async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID required' });
  }
  return res.status(200).json({
    orderId,
    done: 0,
    total: 0,
    variants: [],
  });
};
