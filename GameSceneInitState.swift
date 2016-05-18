//
//  GameSceneInitState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class GameSceneInitState: GameSceneState {

    // MARK: - Lifecycle
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        gameScene.stateMachine.enterState(GameSceneResourceLoadingState.self)
    }
}
