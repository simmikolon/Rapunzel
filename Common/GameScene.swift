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
    static let width: CGFloat = 768
    static let height: CGFloat = 1364
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
    
    override func didMoveToView(view: SKView) {
        super.didMoveToView(view)
        stateMachine.enterState(GameSceneDidMoveToViewState.self)
        registerForPauseNotifications()
    }
    
    // MARK: - Lifecycle
    
    private var lastUpdateTimeInterval: NSTimeInterval = 0
    private let maximumUpdateDeltaTime: NSTimeInterval = 1.0 / 60.0
    
    override func update(currentTime: NSTimeInterval) {
        super.update(currentTime)
        guard view != nil else { return }
        stateMachine.updateWithDeltaTime(deltaTime(currentTime))
    }

    private func deltaTime(currentTime: NSTimeInterval) -> NSTimeInterval {
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
    
    override func inputManagerDidUpdateControlInputSources(inputManager: InputManager) {
        super.inputManagerDidUpdateControlInputSources(inputManager)
        for controlInputSource in inputManager.controlInputSources {
            if let playerEntity = entityManager.entity(withName: "PlayerEntity") {
                controlInputSource.delegate = playerEntity.componentForClass(InputComponent.self)
            }
        }
    }
}
