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

;
