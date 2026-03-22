package logger

import (
	"sync"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	once     sync.Once
	instance *zap.Logger
)

func Init(level, format string) {
	once.Do(func() {
		var lvl zapcore.Level
		lvl.UnmarshalText([]byte(level))
		var cfg zap.Config
		if format == "console" {
			cfg = zap.NewDevelopmentConfig()
		} else {
			cfg = zap.NewProductionConfig()
		}
		cfg.Level = zap.NewAtomicLevelAt(lvl)
		var err error
		instance, err = cfg.Build()
		if err != nil {
			panic(err)
		}
	})
}

func Get() *zap.Logger {
	if instance == nil {
		instance, _ = zap.NewDevelopment()
	}
	return instance
}
