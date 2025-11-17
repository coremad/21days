CC		= emcc

CFLAGS 	= --target=wasm32 -Wall -Wextra -O3

DFLAGS	= \
		-s ASSERTIONS=0 \
# 		--emit-symbol-map \
# 		-DDEBUG
# 		-fsanitize=address \
#		-sSAFE_HEAP=1 \
#		-sSTACK_OVERFLOW_CHECK=2 \
#		-sASSERTIONS=2 \
#

CXXFLAGS	= $(CFLAGS) \
		-Wno-write-strings \
		-Wno-invalid-source-encoding \
		-DENTER_KEY=13 \
#		-std=c++17 \
#		-std=c++98

LDFLAGS	= \
		-Wl,--no-entry \
#		-Wl,--allow-undefined \
# 		-Wl,-z,stack-size=8388608 \
#

JS_LIB_FILE  = src/ts/mod/emexport.js

EXPFLAGS	= \
		-sEXPORTED_FUNCTIONS="['_test', '_start']" \
		--js-library $(JS_LIB_FILE) \
#		-s"EXPORTED_RUNTIME_METHODS=['wasmMemory', 'Asyncify']" \
#		-s "EXPORTED_RUNTIME_METHODS=['_malloc','_free','wasmMemory']"
#

EMFLAGS	= $(CFLAGS) $(LDFLAGS) $(EXPFLAGS) $(DFLAGS) \
		-s ASYNCIFY \
		-s ENVIRONMENT='web' \
		-s EXPORT_ES6=1 \
		-s MODULARIZE=1 \
#		-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
#		-s WARN_ON_UNDEFINED_SYMBOLS=0 \

SRC          = src/cpp
BUILD_DIR    = build
PUBLIC_JS_DIR= public/js/mod

#SRCS         := $(wildcard $(SRC)/*.cpp)
SRCS	= \
		$(SRC)/sys.cpp \
		$(SRC)/orig/interface.cpp\
		$(SRC)/orig/game.cpp \
#


TARGET_NAME  = module

OBJS         := $(patsubst $(SRC)/%.cpp, $(BUILD_DIR)/%.o, $(SRCS))

DEPS         := $(patsubst $(SRC)/%.cpp, $(BUILD_DIR)/%.d, $(SRCS))

TARGET_WASM  = $(PUBLIC_JS_DIR)/$(TARGET_NAME).wasm
TARGET_JS    = $(PUBLIC_JS_DIR)/$(TARGET_NAME).js

.PHONY: all clean wasm ts

all: wasm ts

ts: 
		tsc -b

wasm: $(TARGET_JS) $(TARGET_WASM)

$(TARGET_JS): $(OBJS) $(JS_LIB_FILE) | $(PUBLIC_JS_DIR)
	@echo "Linking targets: $@"
	$(CC) $(OBJS) -o $@ $(EMFLAGS)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(PUBLIC_JS_DIR):
	mkdir -p $(PUBLIC_JS_DIR)

$(BUILD_DIR)/%.o: $(SRC)/%.cpp $(BUILD_DIR)/%.d | $(BUILD_DIR)
	@echo "Compiling $< -> $@"
	$(CC) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR)/%.d: $(SRC)/%.cpp | $(BUILD_DIR)
	@echo "Generating dependencies for $<"
	@mkdir -p $(dir $@)
	$(CC) $(CXXFLAGS) -MMD -MP -MF $@ -c $< -o /dev/null

-include $(DEPS)

clean:
	@echo "Cleaning build and public directories..."
	rm -rf $(BUILD_DIR) $(PUBLIC_JS_DIR)/*.js $(PUBLIC_JS_DIR)/*.wasm $(PUBLIC_JS_DIR)/*.map $(PUBLIC_JS_DIR)/*.symbols 
