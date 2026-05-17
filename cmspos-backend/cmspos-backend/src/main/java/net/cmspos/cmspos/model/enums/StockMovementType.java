package net.cmspos.cmspos.model.enums;

public enum StockMovementType {
    SALE,
    RETURN,
    RECEIVE,
    TRANSFER,
    ADJUSTMENT,
    PURCHASE,
    /** Manual write-off for shrinkage, spoilage, or theft. Deducts FIFO batches without counting as a sale. */
    WRITE_OFF
}
