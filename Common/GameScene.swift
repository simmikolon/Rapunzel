//
//  GameScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct GameSceneSettings {
    static let width: CGFloat = 768//960
    static let height: CGFloat = 1364//1705
    static let SmoothingFactor: CGFloat = 4.0
}

class GameScene: Scene {
    
    // MARK: - Scene Managing Components
    
    let entityManager = EntityManager()
    let dataSource: LevelDataSource = DemoLevelDataSource()
    let contactDelegate = PhysicsWorldContactDelegate()
    
    lazy var stateMachine: GKStateMachine = {
        return GKStateMachine(states: [
            GameSceneInitState(withGameScene: self),
            GameSceneDidMoveToViewState(withGameScene: self),
            GameSceneResourceLoadingState(withGameScene: self),
            GameSceneFinishLoadingResourcesState(withGameScene: self),
            GameSceneCreateLevelEntityState(withGameScene: self),
            GameScenePlayingState(withGameScene: self),
            GameScenePauseState(withGameScene: self)
        ])
    }()
    
    /* Here we set up the PatternManager which is bound to the player layer */
    /* Deleting and Creating Pattern-Beats is done based on the movement inside the player layer */
    /* One single Pattern Manager for all layers - even if they are parallaxed! */
    
    lazy var patternManager: PatternManager = {
        
        guard let playerLayerEntity = self.entityManager.entity(withName: "PlayerLayerEntity") as? LayerEntity else {
            fatalError()
        }
        
        let patternManager = PatternManager(withLayerEntity: playerLayerEntity,
                                              pattern: self.dataSource.demoPattern(),
                                              delegate: self.entityManager)
        
        return patternManager
    }()
    
    // MARK: View Callbacks
    
    override func didMove(to view: SKView) {
        super.didMove(to: view)
        stateMachine.enter(GameSceneDidMoveToViewState.self)
        registerForPauseNotifications()
        #if os(iOS)
        addTouchInputToScene()
        #endif
        
        for inputSource in sceneManager.inputManager.controlInputSources {
            inputSource.gameStateDelegate = self
        }
    }
    
    // MARK: - Lifecycle
    
    fileprivate var lastUpdateTimeInterval: TimeInterval = 0
    fileprivate let maximumUpdateDeltaTime: TimeInterval = 1.0 / 60.0
    
    override func update(_ currentTime: TimeInterval) {
        super.update(currentTime)
        guard view != nil else { return }
        stateMachine.update(deltaTime: deltaTime(currentTime))
    }

    fileprivate func deltaTime(_ currentTime: TimeInterval) -> TimeInterval {
        var deltaTime = currentTime - lastUpdateTimeInterval
        deltaTime = deltaTime > maximumUpdateDeltaTime ? maximumUpdateDeltaTime : deltaTime
        lastUpdateTimeInterval = currentTime
        return deltaTime
    }
    
    // MARK: - Deinitialisation
    
    deinit {
        print("Deinit: GameScene")
    }
    
    // MARK: - Input Manager Delegate
    
    override func inputManagerDidUpdateControlInputSources(_ inputManager: InputManager) {
        super.inputManagerDidUpdateControlInputSources(inputManager)
        for controlInputSource in inputManager.controlInputSources {
            if let playerEntity = entityManager.entity(withName: "PlayerEntity") {
                controlInputSource.delegate = playerEntity.component(ofType: InputComponent.self)
            }
        }
    }
    
    override func inputSourceDidTogglePauseState(_ controlInputSource: InputSource) {
        super.inputSourceDidTogglePauseState(controlInputSource)
        sceneManager.transitionToSceneWithSceneIdentifier(SceneManager.SceneIdentifier.home)
    }
}
