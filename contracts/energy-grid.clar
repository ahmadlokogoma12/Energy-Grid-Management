;; Decentralized Energy Grid Management

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-insufficient-energy (err u103))
(define-constant err-already-registered (err u104))
(define-constant err-trade-not-found (err u105))
(define-constant err-trade-not-open (err u106))
(define-constant err-insufficient-funds (err u107))
(define-constant err-self-trade (err u108))

;; Data variables
(define-data-var energy-price uint u100) ;; Price per unit of energy (in microSTX)
(define-data-var grid-balance int 0) ;; Overall grid energy balance

;; Data maps
(define-map prosumers principal
  { energy-balance: int,
    funds-balance: uint }
)

(define-map energy-trades uint
  { seller: principal,
    buyer: principal,
    amount: uint,
    price: uint,
    status: (string-ascii 20) }
)

(define-data-var next-trade-id uint u0)

;; Private functions
(define-private (is-owner)
  (is-eq tx-sender contract-owner)
)

(define-private (get-prosumer-energy (account principal))
  (default-to 0 (get energy-balance (map-get? prosumers account)))
)

(define-private (get-prosumer-funds (account principal))
  (default-to u0 (get funds-balance (map-get? prosumers account)))
)

;; Public functions
(define-public (register-prosumer)
  (begin
    (asserts! (is-none (map-get? prosumers tx-sender)) err-already-registered)
    (ok (map-set prosumers tx-sender { energy-balance: 0, funds-balance: u0 }))
  )
)

(define-public (add-energy (amount uint))
  (let
    ((current-balance (get-prosumer-energy tx-sender)))
    (map-set prosumers tx-sender
      (merge (default-to { energy-balance: 0, funds-balance: u0 } (map-get? prosumers tx-sender))
             { energy-balance: (+ current-balance (to-int amount)) }))
    (var-set grid-balance (+ (var-get grid-balance) (to-int amount)))
    (ok true)
  )
)

(define-public (consume-energy (amount uint))
  (let
    ((current-balance (get-prosumer-energy tx-sender)))
    (asserts! (>= current-balance (to-int amount)) err-insufficient-energy)
    (map-set prosumers tx-sender
      (merge (default-to { energy-balance: 0, funds-balance: u0 } (map-get? prosumers tx-sender))
             { energy-balance: (- current-balance (to-int amount)) }))
    (var-set grid-balance (- (var-get grid-balance) (to-int amount)))
    (ok true)
  )
)

(define-public (set-energy-price (new-price uint))
  (begin
    (asserts! (is-owner) err-owner-only)
    (ok (var-set energy-price new-price))
  )
)

(define-public (trade-energy (amount uint) (price uint))
  (let
    ((seller-balance (get-prosumer-energy tx-sender))
     (trade-id (var-get next-trade-id)))
    (asserts! (>= seller-balance (to-int amount)) err-insufficient-energy)
    (map-set energy-trades trade-id
      { seller: tx-sender,
        buyer: tx-sender, ;; Will be updated when someone buys
        amount: amount,
        price: price,
        status: "open" })
    (var-set next-trade-id (+ trade-id u1))
    (ok trade-id)
  )
)

(define-public (buy-energy (trade-id uint))
  (let
    ((trade (unwrap! (map-get? energy-trades trade-id) err-trade-not-found))
     (buyer-funds (get-prosumer-funds tx-sender))
     (total-cost (* (get amount trade) (get price trade))))
    (asserts! (is-eq (get status trade) "open") err-trade-not-open)
    (asserts! (>= buyer-funds total-cost) err-insufficient-funds)
    (asserts! (not (is-eq tx-sender (get seller trade))) err-self-trade)

    ;; Update seller
    (map-set prosumers (get seller trade)
      { energy-balance: (- (get-prosumer-energy (get seller trade)) (to-int (get amount trade))),
        funds-balance: (+ (get-prosumer-funds (get seller trade)) total-cost) })

    ;; Update buyer
    (map-set prosumers tx-sender
      { energy-balance: (+ (get-prosumer-energy tx-sender) (to-int (get amount trade))),
        funds-balance: (- buyer-funds total-cost) })

    ;; Update trade status
    (map-set energy-trades trade-id (merge trade { buyer: tx-sender, status: "completed" }))

    (ok true)
  )
)

(define-public (add-funds (amount uint))
  (let
    ((current-funds (get-prosumer-funds tx-sender)))
    (map-set prosumers tx-sender
      (merge (default-to { energy-balance: 0, funds-balance: u0 } (map-get? prosumers tx-sender))
             { funds-balance: (+ current-funds amount) }))
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-energy-price)
  (ok (var-get energy-price))
)

(define-read-only (get-grid-balance)
  (ok (var-get grid-balance))
)

(define-read-only (get-prosumer-info (account principal))
  (ok (default-to { energy-balance: 0, funds-balance: u0 } (map-get? prosumers account)))
)

(define-read-only (get-trade-info (trade-id uint))
  (ok (map-get? energy-trades trade-id))
)
