use std::sync::Arc;

use super::AIProvider;

pub mod custom;

pub use custom::CustomProvider;

pub fn build_default_providers() -> Vec<Arc<dyn AIProvider>> {
    vec![Arc::new(CustomProvider::new())]
}
