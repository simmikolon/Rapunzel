//
//  DebugPlatformEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

enum DebugPlatformAnimationName: String {
    
    case Normal = "DebugPlatformNormal"
    case JumpingOn = "DebugPlatformJumpingOn"
    case JumpingOff = "DebugPlatformJumpingOff"
    case BottomHit = "DebugPlatformBottomHit"
    
    static let atlasNames = [
        
        Normal.rawValue,
        JumpingOn.rawValue,
        JumpingOff.rawValue,
        BottomHit.rawValue
    ]
}

class DebugPlatformEntity: PlatformEntity, ResourceLoadableType {
    
    static var animations: [String: Animation]!
    
    init(isBreakable breakable: Bool, isBottomCollidable bottomCollidable: Bool) {
        
        guard let animations = DebugPlatformEntity.animations else {
            fatalError()
        }
        
        super.init(isBreakable: breakable, isBottomCollidable: bottomCollidable, animations: animations)
    }
}

extension DebugPlatformEntity {
    
    static var resourcesNeedLoading: Bool {
        return true
    }
    
    static func loadResourcesWithCompletionHandler(completionHandler: () -> ()) {
        
        SKTextureAtlas.preloadTextureAtlasesNamed(DebugPlatformAnimationName.atlasNames) { error, atlases in
            
            if let error = error { fatalError("Fatal Error beim Preloading der TextureAtlases: \(error)") }
            
            animations = [:]
            
            animations[PlatformAnimationName.Normal.rawValue] = AnimationComponent.animationsFromAtlas(atlases[0])
            animations[PlatformAnimationName.JumpingOn.rawValue] = AnimationComponent.animationsFromAtlas(atlases[1])
            animations[PlatformAnimationName.JumpingOff.rawValue] = AnimationComponent.animationsFromAtlas(atlases[2])
            animations[PlatformAnimationName.BottomHit.rawValue] = AnimationComponent.animationsFromAtlas(atlases[3])
            
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        animations = nil
    }
    
}
