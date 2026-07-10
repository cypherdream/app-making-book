package com.architecture.master

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.architecture.master.databinding.ActivityMainBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Previously MainActivity only logged build diagnostics and never
 * touched MainViewModel — the ViewModel existed but nothing in the
 * app ever created or observed it.
 */
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        observeUiState()
        viewModel.fetchData()
    }

    private fun observeUiState() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                binding.statusText.text = when (state) {
                    is UiState.Loading -> getString(R.string.status_loading)
                    is UiState.Success -> state.data
                    is UiState.Error -> getString(R.string.status_error, state.message)
                }
            }
        }
    }
}
