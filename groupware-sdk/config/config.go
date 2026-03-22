package config

import (
	"time"
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	DB       DBConfig
	Cache    CacheConfig
	Auth     AuthConfig
	Storage  StorageConfig
	Log      LogConfig
}

type ServerConfig struct {
	Port    string        `mapstructure:"port"`
	Mode    string        `mapstructure:"mode"` // debug | release
	Timeout time.Duration `mapstructure:"timeout"`
}

type DBConfig struct {
	Hosts       []string      `mapstructure:"hosts"`
	Keyspace    string        `mapstructure:"keyspace"`
	Consistency string        `mapstructure:"consistency"`
	Timeout     time.Duration `mapstructure:"timeout"`
}

type CacheConfig struct {
	Addr     string        `mapstructure:"addr"`
	Password string        `mapstructure:"password"`
	DB       int           `mapstructure:"db"`
	TTL      time.Duration `mapstructure:"ttl"`
}

type AuthConfig struct {
	JWTSecret         string        `mapstructure:"jwt_secret"`
	AccessTokenTTL    time.Duration `mapstructure:"access_token_ttl"`
	RefreshTokenTTL   time.Duration `mapstructure:"refresh_token_ttl"`
}

type StorageConfig struct {
	Type    string `mapstructure:"type"`    // local | s3
	BaseDir string `mapstructure:"base_dir"`
}

type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"` // json | console
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AutomaticEnv()
	setDefaults()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}
	cfg := &Config{}
	return cfg, viper.Unmarshal(cfg)
}

func setDefaults() {
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("server.timeout", "30s")

	viper.SetDefault("db.hosts", []string{"localhost:9042"})
	viper.SetDefault("db.keyspace", "groupware")
	viper.SetDefault("db.consistency", "local_quorum")
	viper.SetDefault("db.timeout", "5s")

	viper.SetDefault("cache.addr", "localhost:6379")
	viper.SetDefault("cache.ttl", "24h")

	viper.SetDefault("auth.jwt_secret", "groupware-secret-change-in-production")
	viper.SetDefault("auth.access_token_ttl", "1h")
	viper.SetDefault("auth.refresh_token_ttl", "168h")

	viper.SetDefault("storage.type", "local")
	viper.SetDefault("storage.base_dir", "./data/files")

	viper.SetDefault("log.level", "info")
	viper.SetDefault("log.format", "console")
}
