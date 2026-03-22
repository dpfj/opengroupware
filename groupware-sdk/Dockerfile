FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

FROM alpine:3.19
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /app/server .
COPY --from=builder /app/config.yaml .
RUN mkdir -p /app/data/files /app/test_logs
EXPOSE 8080
CMD ["./server"]
